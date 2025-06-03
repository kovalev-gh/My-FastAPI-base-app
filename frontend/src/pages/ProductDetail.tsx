import { useParams } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Продукт #{id}</h2>
      <p>Детальная информация о продукте</p>
    </div>
  );
};

export default ProductDetail;
